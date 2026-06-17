import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IAuthService } from './interfaces/IAuthService';
import { IAuthRepository } from '../repositories/interfaces/IAuthRepository';

export class AuthService implements IAuthService {
  private authRepository: IAuthRepository;

  // Injection de dépendance (SOLID)
  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  async register(data: any) {
    const existingAdmin = await this.authRepository.findByEmail(data.email);
    if (existingAdmin) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12); // Sécurité : Salt très fort
    const newAdmin = await this.authRepository.create({
      email: data.email,
      password: hashedPassword
    });

    const token = this.generateToken(newAdmin.id);
    const { password, ...adminWithoutPassword } = newAdmin;
    
    return { admin: adminWithoutPassword, token };
  }

  async login(data: any) {
    const admin = await this.authRepository.findByEmail(data.email);
    if (!admin) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(data.password, admin.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(admin.id);
    const { password, ...adminWithoutPassword } = admin;
    
    return { admin: adminWithoutPassword, token };
  }

  private generateToken(adminId: string): string {
    const secret = process.env.JWT_SECRET || 'secret';
    return jwt.sign({ id: adminId }, secret, { expiresIn: '1d' });
  }
}
