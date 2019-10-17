import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { _MatChipListMixinBase } from '@angular/material';
import { AuthService } from './auth.service';
import { catchError } from 'rxjs/operators';
import { Templates, Group, CreatedTemplate, TemplateParaMapping } from 'app/models/template.model';

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

  CreateTemplate(header: CreatedTemplate, selectedFile: File): Observable<number | string> {
    const formData: FormData = new FormData();
    if (selectedFile) {
      formData.append('selectedFile', selectedFile, selectedFile.name);
    }
    formData.append('TemplateType', header.TemplateType);
    formData.append('Description', header.Description);
    formData.append('Entity', header.Entity);
    formData.append('Group', header.Group);
    formData.append('CreatedBy', header.CreatedBy);

    return this._httpClient.post<any>(`${this.baseAddress}api/Template/CreateTemplate`,
      formData,
      // {
      //   headers: new HttpHeaders({
      //     'Content-Type': 'application/json'
      //   })
      // }
    ).pipe(catchError(this.errorHandler));
  }

  CreateTemplateParaMapping(templateParaMappings: TemplateParaMapping[]): Observable<any> {
    return this._httpClient.post<any>(`${this.baseAddress}api/Template/CreateTemplateParaMapping`,
      templateParaMappings, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    })
      .pipe(catchError(this.errorHandler));
  }

  GetTemplateParaMappingsByTemplate(TemplateType: string): Observable<TemplateParaMapping[] | string> {
    return this._httpClient.get<TemplateParaMapping[]>(`${this.baseAddress}api/Template/GetTemplateParaMappingsByTemplate?TemplateType=${TemplateType}`)
      .pipe(catchError(this.errorHandler));
  }

  GetTemplateDocumentByTemplate(TemplateType: string): Observable<Blob | string> {
    return this._httpClient.get(`${this.baseAddress}api/Template/GetTemplateDocumentByTemplate?TemplateType=${TemplateType}`, {
      responseType: 'blob',
      headers: new HttpHeaders().append('Content-Type', 'application/json')
    })
      .pipe(catchError(this.errorHandler));
  }
}
