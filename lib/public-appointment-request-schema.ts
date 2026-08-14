import { z } from "zod";

export const publicAppointmentRequestSchema = z
  .object({
    startsAt: z.string().datetime({ offset: true }),
    comment: z.string().trim().max(1000).optional(),
  })
  .strict()
  .transform(({ startsAt, ...input }) => ({
    ...input,
    startsAt: new Date(startsAt),
  }));

export type PublicAppointmentRequestInput = z.infer<
  typeof publicAppointmentRequestSchema
>;

export const publicAppointmentIdentitySchema = z.object({
  studentId: z.string().min(1).max(255),
  studentName: z.string().trim().min(2).max(100),
  studentEmail: z.string().trim().email().max(254).toLowerCase(),
});

export type PublicAppointmentIdentity = z.infer<
  typeof publicAppointmentIdentitySchema
>;
