import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { HasOrganizationGuard } from '@/modules/auth/guards/has-organization.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';

export const Authenticated = () => applyDecorators(UseGuards(JwtAuthGuard));

export const OrganizationRequired = () =>
  applyDecorators(UseGuards(JwtAuthGuard, HasOrganizationGuard));

export const RoleProtected = () =>
  applyDecorators(UseGuards(JwtAuthGuard, HasOrganizationGuard, RolesGuard));

export const PermissionProtected = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, HasOrganizationGuard, PermissionsGuard),
  );

export const FullyProtected = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, HasOrganizationGuard, RolesGuard, PermissionsGuard),
  );
