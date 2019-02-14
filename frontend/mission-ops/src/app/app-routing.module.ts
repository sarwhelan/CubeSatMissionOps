import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TelecommandsComponent } from './telecommands/telecommands.component';
import { LoginComponent } from './login/login.component';
import { TelecommandBatchesComponent } from './telecommand-batches/telecommand-batches.component';
import { QueuesComponent } from './queues/queues.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { AccessDeniedComponent } from './access-denied/access-denied.component';
import { LogoutComponent } from './logout/logout.component';
import { UsersComponent } from './users/users.component';

import { AuthGuardService } from './services/auth-guard/auth-guard.service';
import { AntiAuthGuardService } from './services/anti-auth-guard/anti-auth-guard.service';
import { AdminGuardService } from './services/admin-guard/admin-guard.service';

const routes: Routes = [
  { path : 'telecommands', component: TelecommandsComponent },
  { path : 'telecommandBatches', component: TelecommandBatchesComponent },
  { path : 'queue', component: QueuesComponent },
  { path : 'login', component: LoginComponent, canActivate: [AntiAuthGuardService] },
  { path : 'users/create', component: CreateUserComponent, canActivate: [AuthGuardService, AdminGuardService] },
  { path : 'error/access-denied', component: AccessDeniedComponent },
  { path : 'logout', component: LogoutComponent, canActivate: [AuthGuardService] },
  { path : 'users', component: UsersComponent, canActivate: [AuthGuardService, AdminGuardService] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
