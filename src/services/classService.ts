import { BaseDataService, COLLECTIONS } from "./dataService";
import type { SchoolClass } from "@/types";

export class ClassService extends BaseDataService<SchoolClass> {
  constructor() {
    super(COLLECTIONS.CLASSES);
  }

  /**
   * Get classes by academic year
   */
  async getByAcademicYear(academicYear: string): Promise<SchoolClass[]> {
    const classes = await this.list();
    return classes.filter((c) => c.academicYear === academicYear && c.isActive);
  }

  /**
   * Get classes by level (nursery, primary, jss, sss)
   */
  async getByLevel(level: SchoolClass["level"]): Promise<SchoolClass[]> {
    const classes = await this.list();
    return classes.filter((c) => c.level === level && c.isActive);
  }

  /**
   * Get classes with available capacity
   */
  async getClassesWithCapacity(): Promise<SchoolClass[]> {
    const classes = await this.list();
    return classes.filter(
      (c) => c.isActive && c.capacity && c.currentEnrollment < c.capacity,
    );
  }

  /**
   * Update class enrollment
   */
  async updateEnrollment(
    classId: string,
    change: number,
  ): Promise<SchoolClass> {
    const classData = await this.getById(classId);
    if (!classData) {
      throw new Error("Class not found");
    }

    const newEnrollment = classData.currentEnrollment + change;
    if (newEnrollment < 0) {
      throw new Error("Cannot have negative enrollment");
    }
    if (classData.capacity && newEnrollment > classData.capacity) {
      throw new Error("Enrollment exceeds class capacity");
    }

    return this.update(classId, { currentEnrollment: newEnrollment });
  }

  /**
   * Get class by name and section
   */
  async getByNameAndSection(
    name: string,
    section?: string,
    academicYear?: string,
  ): Promise<SchoolClass | null> {
    const classes = await this.list();
    return (
      classes.find(
        (c) =>
          c.name === name &&
          c.section === section &&
          c.isActive &&
          (!academicYear || c.academicYear === academicYear),
      ) || null
    );
  }

  /**
   * Get active classes
   */
  async getActiveClasses(): Promise<SchoolClass[]> {
    const classes = await this.list();
    return classes.filter((c) => c.isActive);
  }

  /**
   * Get enrollment statistics
   */
  async getEnrollmentStats(): Promise<{
    totalClasses: number;
    totalCapacity: number;
    totalEnrollment: number;
    utilizationRate: number;
    byLevel: Record<
      string,
      { classes: number; enrollment: number; capacity: number }
    >;
  }> {
    const classes = await this.getActiveClasses();

    const totalCapacity = classes.reduce(
      (sum, c) => sum + (c.capacity || 0),
      0,
    );
    const totalEnrollment = classes.reduce(
      (sum, c) => sum + c.currentEnrollment,
      0,
    );

    const byLevel: Record<
      string,
      { classes: number; enrollment: number; capacity: number }
    > = {};

    classes.forEach((c) => {
      if (!byLevel[c.level]) {
        byLevel[c.level] = { classes: 0, enrollment: 0, capacity: 0 };
      }
      byLevel[c.level].classes++;
      byLevel[c.level].enrollment += c.currentEnrollment;
      byLevel[c.level].capacity += c.capacity || 0;
    });

    return {
      totalClasses: classes.length,
      totalCapacity,
      totalEnrollment,
      utilizationRate:
        totalCapacity > 0 ? (totalEnrollment / totalCapacity) * 100 : 0,
      byLevel,
    };
  }
}

// Export singleton instance
export const classService = new ClassService();
