import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { z } from "zod";

import { FieldError, Input, Label } from "@/components/ui";

export const registrationSchema = z
  .object({
    first_name: z.string().trim().min(1, "First name is required").max(30),
    last_name: z.string().trim().min(1, "Last name is required").max(150),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters"),
    password_confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((value) => value.password === value.password_confirm, {
    path: ["password_confirm"],
    message: "Passwords do not match",
  });

export type RegistrationValues = z.infer<typeof registrationSchema>;

export function RegistrationFields({
  register,
  errors,
  idPrefix = "register",
  passwordLabel = "Password",
  passwordConfirmLabel = "Confirm password",
}: {
  register: UseFormRegister<RegistrationValues>;
  errors: FieldErrors<RegistrationValues>;
  idPrefix?: string;
  passwordLabel?: string;
  passwordConfirmLabel?: string;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${idPrefix}_first_name`}>First name</Label>
          <Input
            id={`${idPrefix}_first_name`}
            autoComplete="given-name"
            {...register("first_name")}
          />
          <FieldError>{errors.first_name?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}_last_name`}>Last name</Label>
          <Input
            id={`${idPrefix}_last_name`}
            autoComplete="family-name"
            {...register("last_name")}
          />
          <FieldError>{errors.last_name?.message}</FieldError>
        </div>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}_email`}>Email address</Label>
        <Input
          id={`${idPrefix}_email`}
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}_password`}>{passwordLabel}</Label>
        <Input
          id={`${idPrefix}_password`}
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        <FieldError>{errors.password?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}_password_confirm`}>{passwordConfirmLabel}</Label>
        <Input
          id={`${idPrefix}_password_confirm`}
          type="password"
          autoComplete="new-password"
          {...register("password_confirm")}
        />
        <FieldError>{errors.password_confirm?.message}</FieldError>
      </div>
    </>
  );
}
