import { Component, OnInit } from '@angular/core';
import { MasterService } from 'app/services/master.service';
import { Group, AuthenticationDetails, MenuApp } from 'app/models/master';
import { NotificationSnackBarComponent } from 'app/notifications/notification-snack-bar/notification-snack-bar.component';
import { Router } from '@angular/router';
import { MatSnackBar, MatDialog, MatDialogConfig } from '@angular/material';
import { SnackBarStatus } from 'app/notifications/notification-snack-bar/notification-snackbar-status-enum';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NotificationDialogComponent } from 'app/notifications/notification-dialog/notification-dialog.component';

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {
  MenuItems: string[];
  authenticationDetails: AuthenticationDetails;
  notificationSnackBarComponent: NotificationSnackBarComponent;
  IsProgressBarVisibile: boolean;
  AllGroups: Group[] = [];
  SelectedGroup: Group;
  searchText = '';
  selectGroupID = 0;
  groupFormGroup: FormGroup;

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
    this.SelectedGroup = new Group();
    this.groupFormGroup = this._formBuilder.group({
      GroupName: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Retrive authorizationData
    const retrievedObject = localStorage.getItem('authorizationData');
    if (retrievedObject) {
      this.authenticationDetails = JSON.parse(retrievedObject) as AuthenticationDetails;
      this.MenuItems = this.authenticationDetails.menuItemNames.split(',');
      if (this.MenuItems.indexOf('Group') < 0) {
        this.notificationSnackBarComponent.openSnackBar('You do not have permission to visit this page', SnackBarStatus.danger);
        this._router.navigate(['/auth/login']);
      }
      this.GetAllGroups();
    } else {
      this._router.navigate(['/auth/login']);
    }
  }

  ResetControl(): void {
    this.SelectedGroup = new Group();
    this.selectGroupID = 0;
    this.groupFormGroup.reset();
    Object.keys(this.groupFormGroup.controls).forEach(key => {
      this.groupFormGroup.get(key).markAsUntouched();
    });

  }

  AddGroup(): void {
    this.ResetControl();
  }

  GetAllGroups(): void {
    this.IsProgressBarVisibile = true;
    this._masterService.GetAllGroups().subscribe(
      (data) => {
        if (data) {
          this.AllGroups = data as Group[];
          if (this.AllGroups.length && this.AllGroups.length > 0) {
            this.loadSelectedGroup(this.AllGroups[0]);
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

  loadSelectedGroup(group: Group): void {
    this.SelectedGroup = group;
    this.selectGroupID = group.GroupID;
    this.groupFormGroup.get('GroupName').patchValue(group.GroupName);
  }

  SaveClicked(): void {
    if (this.groupFormGroup.valid) {
      if (this.SelectedGroup.GroupID) {
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
    if (this.groupFormGroup.valid) {
      if (this.SelectedGroup.GroupID) {
        const Actiontype = 'Delete';
        this.OpenConfirmationDialog(Actiontype);
      }
    } else {
      this.ShowValidationErrors();
    }
  }

  ShowValidationErrors(): void {
    Object.keys(this.groupFormGroup.controls).forEach(key => {
      this.groupFormGroup.get(key).markAsTouched();
      this.groupFormGroup.get(key).markAsDirty();
    });
  }

  OpenConfirmationDialog(Actiontype: string): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        Actiontype: Actiontype,
        Catagory: 'Group'
      },
      panelClass: 'confirmation-dialog'
    };
    const dialogRef = this.dialog.open(NotificationDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          if (Actiontype === 'Create') {
            this.CreateGroup();
          } else if (Actiontype === 'Update') {
            this.UpdateGroup();
          } else if (Actiontype === 'Delete') {
            this.DeleteGroup();
          }
        }
      });
  }

  CreateGroup(): void {
    this.SelectedGroup.GroupName = this.groupFormGroup.get('GroupName').value;
    this.SelectedGroup.CreatedBy = this.authenticationDetails.userID.toString();
    this.IsProgressBarVisibile = true;
    this._masterService.CreateGroup(this.SelectedGroup).subscribe(
      (data) => {
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar('Group created successfully', SnackBarStatus.success);
        this.GetAllGroups();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

  UpdateGroup(): void {
    this.SelectedGroup.GroupName = this.groupFormGroup.get('GroupName').value;
    this.SelectedGroup.ModifiedBy = this.authenticationDetails.userID.toString();
    this.IsProgressBarVisibile = true;
    this._masterService.UpdateGroup(this.SelectedGroup).subscribe(
      (data) => {
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar('Group updated successfully', SnackBarStatus.success);
        this.GetAllGroups();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

  DeleteGroup(): void {
    this.SelectedGroup.GroupName = this.groupFormGroup.get('GroupName').value;
    this.SelectedGroup.ModifiedBy = this.authenticationDetails.userID.toString();
    this.IsProgressBarVisibile = true;
    this._masterService.DeleteGroup(this.SelectedGroup).subscribe(
      (data) => {
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar('Group deleted successfully', SnackBarStatus.success);
        this.GetAllGroups();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

}
