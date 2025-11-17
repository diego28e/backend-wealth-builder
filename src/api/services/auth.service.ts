import { supabase } from '../../config/supabase.js';
import { RegisterSchema, LoginSchema, UserWithPasswordSchema, UserResponseSchema } from '../models/auth.model.js';
import { hashPassword, verifyPassword } from '../../utils/auth.js';
import type { RegisterInput, LoginInput, UserWithPassword, UserResponse } from '../models/auth.model.js';

export const registerUser = async (userData: RegisterInput): Promise<UserResponse> => {
  const validatedData = RegisterSchema.parse(userData);
  
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('email')
    .eq('email', validatedData.email)
    .single();
  
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Hash password
  const password_hash = await hashPassword(validatedData.password);
  
  // Insert user (without password field)
  const { data, error } = await supabase
    .from('users')
    .insert({
      email: validatedData.email,
      password_hash,
      first_name: validatedData.first_name,
      last_name: validatedData.last_name,
      profile: validatedData.profile || 'Low-Income' // default if not provided
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create user: ${error.message}`);
  
  // Return user without password_hash
  const userResponse = UserResponseSchema.parse(data);
  return userResponse;
};

export const getUserByEmail = async (email: string): Promise<UserWithPassword | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) return null;
  return UserWithPasswordSchema.parse(data);
};

export const loginUser = async (loginData: LoginInput): Promise<UserWithPassword> => {
  const validatedData = LoginSchema.parse(loginData);
  
  const user = await getUserByEmail(validatedData.email);
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  const isValidPassword = await verifyPassword(user.password_hash, validatedData.password);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }
  
  return user;
};