import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { AuthenticationDetails } from 'app/models/master';
import { Guid } from 'guid-typescript';
import { NotificationSnackBarComponent } from 'app/notifications/notification-snack-bar/notification-snack-bar.component';
import { Header, SignedHeaderView } from 'app/models/home.model';
import { MatTableDataSource, MatPaginator, MatSort, MatSnackBar, MatDialog, MatDialogConfig } from '@angular/material';
import { Router } from '@angular/router';
import { HomeService } from 'app/services/home.service';
import { SnackBarStatus } from 'app/notifications/notification-snack-bar/notification-snackbar-status-enum';
import { PdfDialogComponent } from '../pdf-dialog/pdf-dialog.component';

@Component({
  selector: 'app-signed-document',
  templateUrl: './signed-document.component.html',
  styleUrls: ['./signed-document.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations
})
export class SignedDocumentComponent implements OnInit {

  authenticationDetails: AuthenticationDetails;
  MenuItems: string[];
  CurrentUserName: string;
  CurrentUserID: Guid;
  CurrentUserRole = '';
  notificationSnackBarComponent: NotificationSnackBarComponent;
  IsProgressBarVisibile: boolean;
  AllSignedDocuments: SignedHeaderView[] = [];
  SignDocumentsDataSource: MatTableDataSource<SignedHeaderView>;
  SignDocumentsColumns: string[] = ['DocName', 'DocType', 'FileType', 'NoOfApprover', 'LastApprover', 'LastApproverComment', 'LastApprovedOn', 'CreatedOn', 'View'];
  @ViewChild(MatPaginator) SignDocumentsPaginator: MatPaginator;
  @ViewChild(MatSort) SignDocumentsSort: MatSort;

  constructor(
    private _router: Router,
    public snackBar: MatSnackBar,
    private dialog: MatDialog,
    private _homeService: HomeService
  ) {
    this.notificationSnackBarComponent = new NotificationSnackBarComponent(this.snackBar);
    this.IsProgressBarVisibile = false;
  }
  ngOnInit(): void {
    const retrievedObject = localStorage.getItem('authorizationData');
    if (retrievedObject) {
      this.authenticationDetails = JSON.parse(retrievedObject) as AuthenticationDetails;
      this.CurrentUserName = this.authenticationDetails.userName;
      this.CurrentUserID = this.authenticationDetails.userID;
      this.CurrentUserRole = this.authenticationDetails.userRole;
      this.MenuItems = this.authenticationDetails.menuItemNames.split(',');
      if (this.MenuItems.indexOf('SignedDocument') < 0) {
        this.notificationSnackBarComponent.openSnackBar('You do not have permission to visit this page', SnackBarStatus.danger);
        this._router.navigate(['/auth/login']);
      }
    } else {
      this._router.navigate(['/auth/login']);
    }
    this.GetAllSignedDocuments();
  }

  GetAllSignedDocuments(): void {
    this.IsProgressBarVisibile = true;
    this._homeService.GetAllSignedDocuments().subscribe(
      (data) => {
        if (data) {
          this.AllSignedDocuments = data as SignedHeaderView[];
          this.SignDocumentsDataSource = new MatTableDataSource(this.AllSignedDocuments);
          this.SignDocumentsDataSource.paginator = this.SignDocumentsPaginator;
          this.SignDocumentsDataSource.sort = this.SignDocumentsSort;
        }
        this.IsProgressBarVisibile = false;
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
      }
    );
  }

  ViewPdfFromID(DOCID: number): void {
    this.IsProgressBarVisibile = true;
    this._homeService.GetHeaderDocumentByDocID(DOCID).subscribe(
      data => {
        if (data) {
          const file = new Blob([data], { type: 'application/pdf' });
          const dialogConfig: MatDialogConfig = {
            data: file,
            panelClass: 'pdf-dialog'
          };
          const dialogRef = this.dialog.open(PdfDialogComponent, dialogConfig);
          dialogRef.afterClosed().subscribe(
            result => {
              if (result) {
              }
            });
        }
        this.IsProgressBarVisibile = false;
      },
      error => {
        console.error(error);
        this.IsProgressBarVisibile = false;
      }
    );
  }

}
