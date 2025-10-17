import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { HashingService } from '../hashing/hashing.service';

export class UsersSeed {
  constructor(
    private dataSource: DataSource,
    private hashingService: HashingService,
  ) {}

  async run() {
    const userRepository = this.dataSource.getRepository(User);

    const users = [
      {
        name: 'Douglas',
        email: 'douglas@exemplo.com',
        password: 'Test123!',
      },
      {
        name: 'Diego',
        email: 'diego@exemplo.com',
        password: 'Test123!',
      },
      {
        name: 'Adriana',
        email: 'adriana@exemplo.com',
        password: 'Test123!',
      },
      {
        name: 'Julia',
        email: 'julia@exemplo.com',
        password: 'Test123!',
      },
      {
        name: 'Admin',
        email: 'admin@exemplo.com',
        password: 'Test123!',
      },
    ];

    for (const userData of users) {
      const existingUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const hashedPassword = await this.hashingService.hash(userData.password);
        const user = userRepository.create({
          ...userData,
          password: hashedPassword,
          avatar: `https://robohash.org/${userData.email}`,
        });

        await userRepository.save(user);
        console.log(`✅ User created: ${userData.name} (${userData.email})`);
      } else {
        console.log(`⏭️  User already exists: ${userData.name} (${userData.email})`);
      }
    }

    console.log('🎉 Users seed completed!');
  }
}
