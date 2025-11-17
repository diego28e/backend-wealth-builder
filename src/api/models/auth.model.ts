import {z} from "zod";

export const RegisterSchema = z.object({
    email:z.string().email(),
    password:z.string().min(8, "Password must be at least 8 characters long"),
    first_name: z.string().min(1,"First name is required"),
    last_name: z.string().min(1, "last name is requied"),
    profile: z.enum(["Low-Income", "High-Income/High-Expense", "Wealth-Builder"]).optional()
})

export const LoginSchema = z.object({
    email:z.string().email(),
    password:z.string().min(1, "Password is required")
})

export const UserWithPasswordSchema = z.object({
    id: z.string().uuid().optional(),
    email: z.string().email(),
    password_hash: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    profile: z.enum(["Low-Income", "High-Income/High-Expense", "Wealth-Builder"]),
    default_currency_code: z.string().length(3).default('COP'),
    created_at: z.string().optional(),
    updated_at: z.string().optional()
})

export const UserResponseSchema = UserWithPasswordSchema.omit({password_hash:true})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type UserWithPassword = z.infer<typeof UserWithPasswordSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>