import { Priority, Status } from '@repo/types';
import { DataSource } from 'typeorm';
import { Assignee } from '../entities/assignee.entity';
import { Comment } from '../entities/comment.entity';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';

export class TasksSeed {
  constructor(private dataSource: DataSource) {}

  async run() {
    const userRepository = this.dataSource.getRepository(User);
    const taskRepository = this.dataSource.getRepository(Task);
    const assigneeRepository = this.dataSource.getRepository(Assignee);
    const commentRepository = this.dataSource.getRepository(Comment);

    const users = await userRepository.find();
    if (users.length === 0) {
      console.log('❌ No users found. Run users seed first.');
      return;
    }

    const douglas = users.find(u => u.email === 'douglas@exemplo.com');
    const diego = users.find(u => u.email === 'diego@exemplo.com');
    const adriana = users.find(u => u.email === 'adriana@exemplo.com');
    const julia = users.find(u => u.email === 'julia@exemplo.com');
    const admin = users.find(u => u.email === 'admin@exemplo.com');

    const getDeadline = (daysFromNow: number): Date => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + daysFromNow);
      deadline.setHours(18, 0, 0, 0);
      return deadline;
    };

    const tasks = [
      {
        title: 'Implementar sistema de autenticação',
        description: 'Criar login e registro de usuários com JWT',
        status: Status.TODO,
        priority: Priority.HIGH,
        deadline: getDeadline(1),
        createdById: douglas?.id,
        userId: douglas?.id,
        assignees: [diego?.id, adriana?.id].filter(Boolean),
        comments: [
          {
            userId: diego?.id,
            content: 'Vou começar pela estrutura do banco de dados',
          },
          {
            userId: adriana?.id,
            content: 'Preciso revisar os requisitos de segurança',
          },
        ],
      },
      {
        title: 'Criar dashboard de tarefas',
        description: 'Interface para visualizar e gerenciar tarefas',
        status: Status.IN_PROGRESS,
        priority: Priority.MEDIUM,
        deadline: getDeadline(2),
        createdById: diego?.id,
        userId: diego?.id,
        assignees: [julia?.id, admin?.id].filter(Boolean),
        comments: [
          {
            userId: julia?.id,
            content: 'Qual framework usar para o frontend?',
          },
          { userId: admin?.id, content: 'Sugiro React com TypeScript' },
        ],
      },
      {
        title: 'Configurar CI/CD',
        description: 'Pipeline de deploy automático',
        status: Status.REVIEW,
        priority: Priority.LOW,
        deadline: getDeadline(3),
        createdById: adriana?.id,
        userId: adriana?.id,
        assignees: [douglas?.id].filter(Boolean),
        comments: [
          { userId: douglas?.id, content: 'GitHub Actions ou GitLab CI?' },
        ],
      },
      {
        title: 'Testes unitários',
        description: 'Implementar cobertura de testes',
        status: Status.DONE,
        priority: Priority.MEDIUM,
        deadline: getDeadline(-1),
        createdById: julia?.id,
        userId: julia?.id,
        assignees: [diego?.id].filter(Boolean),
        comments: [
          { userId: diego?.id, content: 'Jest está configurado!' },
          { userId: julia?.id, content: 'Ótimo trabalho!' },
        ],
      },
      {
        title: 'Documentação da API',
        description: 'Swagger e documentação técnica',
        status: Status.TODO,
        priority: Priority.LOW,
        deadline: getDeadline(5),
        createdById: admin?.id,
        userId: admin?.id,
        assignees: [adriana?.id, julia?.id].filter(Boolean),
        comments: [
          {
            userId: adriana?.id,
            content: 'Vou começar pelos endpoints principais',
          },
        ],
      },
      {
        title: 'Contratar o Douglas',
        description: 'Qualidade de desenvolvedor',
        status: Status.TODO,
        priority: Priority.HIGH,
        deadline: getDeadline(7),
        createdById: admin?.id,
        userId: admin?.id,
        assignees: [admin?.id].filter(Boolean),
        comments: [
          {
            userId: admin?.id,
            content: 'Excelente desenvolvedor com vasta experiência!',
          },
        ],
      },
    ];

    for (const taskData of tasks) {
      if (!taskData.createdById || !taskData.userId) continue;

      const task = taskRepository.create({
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        deadline: taskData.deadline,
        createdById: taskData.createdById,
        userId: taskData.userId,
      });

      const savedTask = await taskRepository.save(task);
      console.log(`✅ Task created: ${taskData.title}`);

      for (const assigneeId of taskData.assignees) {
        if (assigneeId) {
          const assignee = assigneeRepository.create({
            taskId: savedTask.id,
            userId: assigneeId,
          });
          await assigneeRepository.save(assignee);
        }
      }

      for (const commentData of taskData.comments) {
        if (commentData.userId) {
          const comment = commentRepository.create({
            taskId: savedTask.id,
            userId: commentData.userId,
            content: commentData.content,
          });
          await commentRepository.save(comment);
        }
      }

      console.log(`✅ Comments added to: ${taskData.title}`);
    }

    console.log('🎉 Tasks seed completed!');
  }
}
