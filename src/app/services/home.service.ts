import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { _MatChipListMixinBase } from '@angular/material';
import { AuthService } from './auth.service';
import { catchError } from 'rxjs/operators';
import { MenuApp, RoleWithApp, UserWithRole, UserNotification } from 'app/models/master';
import { HeaderAndApproverList, AssignedApprover, Header, HeaderView, Approver, ApproverView } from 'app/models/home.model';

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

  GetAllApprovers(): Observable<Approver[] | string> {
    return this._httpClient.get<Approver[]>(`${this.baseAddress}api/Home/GetAllApprovers`)
      .pipe(catchError(this.errorHandler));
  }

  GetAllApproverViews(): Observable<ApproverView[] | string> {
    return this._httpClient.get<ApproverView[]>(`${this.baseAddress}api/Home/GetAllApproverViews`)
      .pipe(catchError(this.errorHandler));
  }

  GetAllHeaders(): Observable<HeaderView[] | string> {
    return this._httpClient.get<HeaderView[]>(`${this.baseAddress}api/Home/GetAllHeaders`)
      .pipe(catchError(this.errorHandler));
  }

  GetAllHeadersByUserName(UserName: string): Observable<HeaderView[] | string> {
    return this._httpClient.get<HeaderView[]>(`${this.baseAddress}api/Home/GetAllHeadersByUserName?UserName=${UserName}`)
      .pipe(catchError(this.errorHandler));
  }

  GetHeaderDocumentByDocID(DOCID: number): Observable<Blob | string> {
    return this._httpClient.get(`${this.baseAddress}api/Home/GetHeaderDocumentByDocID?DOCID=${DOCID}`, {
      responseType: 'blob',
      headers: new HttpHeaders().append('Content-Type', 'application/json')
    })
      .pipe(catchError(this.errorHandler));
  }

  GetAssignedApproversByDocID(DOCID: number): Observable<AssignedApprover[] | string> {
    return this._httpClient.get<AssignedApprover[]>(`${this.baseAddress}api/Home/GetAssignedApproversByDocID?DOCID=${DOCID}`)
      .pipe(catchError(this.errorHandler));
  }

  CreateHeader(header: HeaderView, selectedFile: File): Observable<number | string> {
    const formData: FormData = new FormData();
    if (selectedFile) {
      formData.append('selectedFile', selectedFile, selectedFile.name);
    }
    formData.append('DocName', header.DocName);
    formData.append('DocType', header.DocType);
    formData.append('FileType', header.FileType);
    formData.append('CreatedBy', header.CreatedBy);

    return this._httpClient.post<any>(`${this.baseAddress}api/Home/CreateHeader`,
      formData,
      // {
      //   headers: new HttpHeaders({
      //     'Content-Type': 'application/json'
      //   })
      // }
    ).pipe(catchError(this.errorHandler));
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

  ApproveDocument(DOCID: number, Approve: string, Comments: string): Observable<string> {
    return this._httpClient.get<string>(`${this.baseAddress}api/Home/ApproveDocument?DOCID=${DOCID}&Approver=${Approve}&Comments=${Comments}`)
      .pipe(catchError(this.errorHandler));
  }

}
