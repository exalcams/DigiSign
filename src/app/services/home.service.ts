import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { _MatChipListMixinBase } from '@angular/material';
import { AuthService } from './auth.service';
import { catchError } from 'rxjs/operators';
import { MenuApp, RoleWithApp, UserWithRole, UserNotification } from 'app/models/master';
import { HeaderAndApproverList, AssignedApprover, Header } from 'app/models/home.model';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  baseAddress: string;
  NotificationEvent: Subject<any>;


  constructor(private _httpClient: HttpClient, private _authService: AuthService) {
    this.baseAddress = _authService.baseAddress;
    this.NotificationEvent = new Subject();
  }

  // Error Handler
  errorHandler(error: HttpErrorResponse): Observable<string> {
    return throwError(error.error || error.message || 'Server Error');
  }


  GetAllHeaders(): Observable<Header[] | string> {
    return this._httpClient.get<Header[]>(`${this.baseAddress}api/Home/GetAllHeaders`)
      .pipe(catchError(this.errorHandler));
  }

  GetAssignedApproversByDocID(DOCID: number): Observable<AssignedApprover[] | string> {
    return this._httpClient.get<AssignedApprover[]>(`${this.baseAddress}api/Home/GetAssignedApproversByDocID?DOCID=${DOCID}`)
      .pipe(catchError(this.errorHandler));
  }

  AssignApprovers(assignedApprovers: AssignedApprover[]): Observable<any> {
    return this._httpClient.post<any>(`${this.baseAddress}api/Home/AssignApprovers`,
      assignedApprovers, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    })
      .pipe(catchError(this.errorHandler));
  }

}
