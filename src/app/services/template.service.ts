import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { _MatChipListMixinBase } from '@angular/material';
import { AuthService } from './auth.service';
import { catchError } from 'rxjs/operators';
import { Templates, Group } from 'app/models/template.model';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {

  baseAddress: string;
  NotificationEvent: Subject<any>;


  constructor(private _httpClient: HttpClient, _authService: AuthService) {
    this.baseAddress = _authService.baseAddress;
    this.NotificationEvent = new Subject();
  }

  // Error Handler
  errorHandler(error: HttpErrorResponse): Observable<string> {
    return throwError(error.error || error.message || 'Server Error');
  }

  GetAllTemplates(): Observable<Templates[] | string> {
    return this._httpClient.get<Templates[]>(`${this.baseAddress}api/Template/GetAllTemplates`)
      .pipe(catchError(this.errorHandler));
  }
  GetAllGroups(): Observable<Group[] | string> {
    return this._httpClient.get<Group[]>(`${this.baseAddress}api/Template/GetAllGroups`)
      .pipe(catchError(this.errorHandler));
  }

}
