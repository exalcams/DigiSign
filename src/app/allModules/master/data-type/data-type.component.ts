import { Component, OnInit } from '@angular/core';
import { MasterService } from 'app/services/master.service';
import { DataType, AuthenticationDetails, MenuApp } from 'app/models/master';
import { NotificationSnackBarComponent } from 'app/notifications/notification-snack-bar/notification-snack-bar.component';
import { Router } from '@angular/router';
import { MatSnackBar, MatDialog, MatDialogConfig } from '@angular/material';
import { SnackBarStatus } from 'app/notifications/notification-snack-bar/notification-snackbar-status-enum';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NotificationDialogComponent } from 'app/notifications/notification-dialog/notification-dialog.component';

@Component({
  selector: 'app-data-type',
  templateUrl: './data-type.component.html',
  styleUrls: ['./data-type.component.scss']
})
export class DataTypeComponent implements OnInit {
  MenuItems: string[];
  authenticationDetails: AuthenticationDetails;
  notificationSnackBarComponent: NotificationSnackBarComponent;
  IsProgressBarVisibile: boolean;
  AllDataTypes: DataType[] = [];
  SelectedDataType: DataType;
  searchText = '';
  selectDataTypeID = 0;
  DataTypeFormGroup: FormGroup;

  constructor(
    private _masterService: MasterService,
    private _router: Router,
    public snackBar: MatSnackBar,
    private _formBuilder: FormBuilder,
    private dialog: MatDialog
  ) {
    this.authenticationDetails = new AuthenticationDetails();
    this.notificationSnackBarComponent = new NotificationSnackBarComponent(this.snackBar);
    this.IsProgressBarVisibile = false;
    this.SelectedDataType = new DataType();
    this.DataTypeFormGroup = this._formBuilder.group({
      DataTypeName: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Retrive authorizationData
    const retrievedObject = localStorage.getItem('authorizationData');
    if (retrievedObject) {
      this.authenticationDetails = JSON.parse(retrievedObject) as AuthenticationDetails;
      this.MenuItems = this.authenticationDetails.menuItemNames.split(',');
      if (this.MenuItems.indexOf('DataType') < 0) {
        this.notificationSnackBarComponent.openSnackBar('You do not have permission to visit this page', SnackBarStatus.danger);
        this._router.navigate(['/auth/login']);
      }
      this.GetAllDataTypes();
    } else {
      this._router.navigate(['/auth/login']);
    }
  }

  ResetControl(): void {
    this.SelectedDataType = new DataType();
    this.selectDataTypeID = 0;
    this.DataTypeFormGroup.reset();
    Object.keys(this.DataTypeFormGroup.controls).forEach(key => {
      this.DataTypeFormGroup.get(key).markAsUntouched();
    });

  }

  AddDataType(): void {
    this.ResetControl();
  }

  GetAllDataTypes(): void {
    this.IsProgressBarVisibile = true;
    this._masterService.GetAllDataTypes().subscribe(
      (data) => {
        if (data) {
          this.AllDataTypes = data as DataType[];
          if (this.AllDataTypes.length && this.AllDataTypes.length > 0) {
            this.loadSelectedDataType(this.AllDataTypes[0]);
          }
          this.IsProgressBarVisibile = false;
        }
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
      }
    );
  }

  loadSelectedDataType(dataType: DataType): void {
    this.SelectedDataType = dataType;
    this.selectDataTypeID = dataType.ID;
    this.DataTypeFormGroup.get('DataTypeName').patchValue(dataType.DataTypeName);
  }

  SaveClicked(): void {
    if (this.DataTypeFormGroup.valid) {
      if (this.SelectedDataType.ID) {
        const Actiontype = 'Update';
        this.OpenConfirmationDialog(Actiontype);
      } else {
        const Actiontype = 'Create';
        this.OpenConfirmationDialog(Actiontype);
      }
    } else {
      this.ShowValidationErrors();
    }
  }

  DeleteClicked(): void {
    if (this.DataTypeFormGroup.valid) {
      if (this.SelectedDataType.ID) {
        const Actiontype = 'Delete';
        this.OpenConfirmationDialog(Actiontype);
      }
    } else {
      this.ShowValidationErrors();
    }
  }

  ShowValidationErrors(): void {
    Object.keys(this.DataTypeFormGroup.controls).forEach(key => {
      this.DataTypeFormGroup.get(key).markAsTouched();
      this.DataTypeFormGroup.get(key).markAsDirty();
    });
  }

  OpenConfirmationDialog(Actiontype: string): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        Actiontype: Actiontype,
        Catagory: 'DataType'
      },
      panelClass: 'confirmation-dialog'
    };
    const dialogRef = this.dialog.open(NotificationDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          if (Actiontype === 'Create') {
            this.CreateDataType();
          } else if (Actiontype === 'Update') {
            this.UpdateDataType();
          } else if (Actiontype === 'Delete') {
            this.DeleteDataType();
          }
        }
      });
  }

  CreateDataType(): void {
    this.SelectedDataType.DataTypeName = this.DataTypeFormGroup.get('DataTypeName').value;
    this.SelectedDataType.CreatedBy = this.authenticationDetails.userID.toString();
    this.IsProgressBarVisibile = true;
    this._masterService.CreateDataType(this.SelectedDataType).subscribe(
      (data) => {
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar('DataType created successfully', SnackBarStatus.success);
        this.GetAllDataTypes();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

  UpdateDataType(): void {
    this.SelectedDataType.DataTypeName = this.DataTypeFormGroup.get('DataTypeName').value;
    this.SelectedDataType.ModifiedBy = this.authenticationDetails.userID.toString();
    this.IsProgressBarVisibile = true;
    this._masterService.UpdateDataType(this.SelectedDataType).subscribe(
      (data) => {
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar('Data type updated successfully', SnackBarStatus.success);
        this.GetAllDataTypes();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

  DeleteDataType(): void {
    this.SelectedDataType.DataTypeName = this.DataTypeFormGroup.get('DataTypeName').value;
    this.SelectedDataType.ModifiedBy = this.authenticationDetails.userID.toString();
    this.IsProgressBarVisibile = true;
    this._masterService.DeleteDataType(this.SelectedDataType).subscribe(
      (data) => {
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar('DataType deleted successfully', SnackBarStatus.success);
        this.GetAllDataTypes();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

}
