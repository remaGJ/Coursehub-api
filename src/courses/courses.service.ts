import { Injectable } from '@nestjs/common';

type Course = {
  id: number;
  title: string;
  level: string;
};

type CreateCourse = {
  title: string;
  level: string;
};

@Injectable()
export class CoursesService {
  private courses: Course[] = [
    { id: 1, title: 'NestJS Fundamentals', level: 'Beginner' },
    { id: 2, title: 'REST API With NestJS', level: 'Beginner' },
    { id: 3, title: 'NestJS Architecture', level: 'Intermediate' },
  ];

  findAll(level?: string): Course[] {
    if (!level) {
      return this.courses;
    }
    return this.courses.filter((course) => course.level === level);
  }

  
  findOne(id: number): Course | undefined {
    return this.courses.find((course) => course.id === id);
  }

  create(input: CreateCourse): Course {
    const course: Course = {
      id: Math.max(0, ...this.courses.map((c) => c.id)) + 1,
      title: input.title,
      level: input.level,
    };
    this.courses.push(course);
    return course;
  }

  remove(id:number): Course | undefined {
    const index = this.courses.findIndex((course) => course.id === id)

    if (index ===-1){
        return undefined
    }

    const [removedCourse]= this.courses.splice(index, 1)
    return removedCourse;
  }

  update ();

}
