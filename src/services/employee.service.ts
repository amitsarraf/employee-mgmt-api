import Employee, { IEmployee } from '../models/Employee.model';
import CacheService from './cache.service';
import { GraphQLError } from 'graphql';

class EmployeeService {
  private cacheService = CacheService;
  private CACHE_TTL = 300; // 5 minutes

  /**
   * Get employees with filters, pagination, and sorting
   */
  async getEmployees(
    filter: any = {},
    pagination: any = { page: 1, limit: 10 },
    sort: any = { field: 'createdAt', order: 'DESC' }
  ) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { isActive: true };

    if (filter.name) {
      query.name = { $regex: filter.name, $options: 'i' };
    }

    if (filter.email) {
      query.email = { $regex: filter.email, $options: 'i' };
    }

    if (filter.class) {
      query.class = filter.class;
    }

    if (filter.department) {
      query.department = filter.department;
    }

    if (filter.ageMin || filter.ageMax) {
      query.age = {};
      if (filter.ageMin) query.age.$gte = filter.ageMin;
      if (filter.ageMax) query.age.$lte = filter.ageMax;
    }

    if (filter.subject) {
      query.subjects = filter.subject;
    }

    if (typeof filter.isActive === 'boolean') {
      query.isActive = filter.isActive;
    }

    // Check cache
    const cacheKey = `employees:${JSON.stringify({ query, skip, limit, sort })}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Sort configuration
    const sortOrder = sort.order === 'ASC' ? 1 : -1;
    const sortField = sort.field || 'createdAt';

    // Execute query with performance optimizations
    const [data, total] = await Promise.all([
      Employee.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName email')
        .lean() // Use lean() for better performance (read-only)
        .exec(),
      Employee.countDocuments(query)
    ]);

    const pages = Math.ceil(total / limit);

    const result = {
      data,
      pagination: {
        total,
        page,
        limit,
        pages,
        hasNextPage: page < pages,
        hasPrevPage: page > 1
      }
    };

    // Cache the result
    await this.cacheService.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

    return result;
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string): Promise<IEmployee | null> {
    // Check cache first
    const cacheKey = `employee:${id}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const employee = await Employee.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .exec();

    if (employee) {
      // Cache for 5 minutes
      await this.cacheService.set(
        cacheKey,
        JSON.stringify(employee),
        this.CACHE_TTL
      );
    }

    return employee;
  }

  /**
   * Create new employee
   */
  async createEmployee(input: any, createdBy: string): Promise<IEmployee> {
    // Check if email already exists
    const existing = await Employee.findOne({ email: input.email });
    if (existing) {
      throw new GraphQLError('Employee with this email already exists', {
        extensions: { code: 'DUPLICATE_EMAIL' }
      });
    }

    const employee = new Employee({
      ...input,
      createdBy
    });

    await employee.save();

    // Invalidate list cache
    await this.cacheService.deletePattern('employees:*');

    return employee.populate('createdBy', 'firstName lastName email');
  }

  /**
   * Update employee
   */
  async updateEmployee(id: string, input: any): Promise<IEmployee | null> {
    // If email is being updated, check for duplicates
    if (input.email) {
      const existing = await Employee.findOne({
        email: input.email,
        _id: { $ne: id }
      });

      if (existing) {
        throw new GraphQLError('Email already in use', {
          extensions: { code: 'DUPLICATE_EMAIL' }
        });
      }
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    if (employee) {
      // Invalidate caches
      await Promise.all([
        this.cacheService.delete(`employee:${id}`),
        this.cacheService.deletePattern('employees:*')
      ]);
    }

    return employee;
  }

  /**
   * Delete employee (soft delete)
   */
  async deleteEmployee(id: string): Promise<boolean> {
    const employee = await Employee.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (employee) {
      // Invalidate caches
      await Promise.all([
        this.cacheService.delete(`employee:${id}`),
        this.cacheService.deletePattern('employees:*')
      ]);
      return true;
    }

    return false;
  }

  /**
   * Search employees with full-text search
   */
  async searchEmployees(searchQuery: string, pagination: any = {}) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Employee.find(
        { $text: { $search: searchQuery }, isActive: true },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName email')
        .lean()
        .exec(),
      Employee.countDocuments({
        $text: { $search: searchQuery },
        isActive: true
      })
    ]);

    const pages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages,
        hasNextPage: page < pages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Mark attendance for employee
   */
  async markAttendance(employeeId: string, attendance: any): Promise<IEmployee | null> {
    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $push: { attendance } },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    if (employee) {
      await this.cacheService.delete(`employee:${employeeId}`);
    }

    return employee;
  }

  /**
   * Bulk update employees
   */
  async bulkUpdateEmployees(ids: string[], input: any): Promise<IEmployee[]> {
    await Employee.updateMany(
      { _id: { $in: ids } },
      { $set: input }
    );

    // Invalidate caches
    await Promise.all([
      ...ids.map(id => this.cacheService.delete(`employee:${id}`)),
      this.cacheService.deletePattern('employees:*')
    ]);

    return Employee.find({ _id: { $in: ids } })
      .populate('createdBy', 'firstName lastName email')
      .exec();
  }

  /**
   * Get employee statistics (for dashboard)
   */
  async getEmployeeStats() {
    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      avgAgeResult,
      departmentCounts,
      attendanceStats
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ isActive: true }),
      Employee.countDocuments({ isActive: false }),
      Employee.aggregate([
        { $group: { _id: null, avgAge: { $avg: '$age' } } }
      ]),
      Employee.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$department', count: { $count: {} } } },
        { $project: { department: '$_id', count: 1, _id: 0 } }
      ]),
      Employee.aggregate([
        { $unwind: '$attendance' },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            presentDays: {
              $sum: { $cond: [{ $eq: ['$attendance.status', 'present'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const averageAttendanceRate =
      attendanceStats.length > 0
        ? (attendanceStats[0].presentDays / attendanceStats[0].totalDays) * 100
        : 0;

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      averageAge: avgAgeResult[0]?.avgAge || 0,
      departmentCounts: departmentCounts.filter(d => d.department),
      averageAttendanceRate
    };
  }
}

export default new EmployeeService();