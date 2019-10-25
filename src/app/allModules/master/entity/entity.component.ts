import { Component, OnInit } from '@angular/core';
import { MasterService } from 'app/services/master.service';
import { Entity, AuthenticationDetails, MenuApp } from 'app/models/master';
import { NotificationSnackBarComponent } from 'app/notifications/notification-snack-bar/notification-snack-bar.component';
import { Router } from '@angular/router';
import { MatSnackBar, MatDialog, MatDialogConfig } from '@angular/material';
import { SnackBarStatus } from 'app/notifications/notification-snack-bar/notification-snackbar-status-enum';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NotificationDialogComponent } from 'app/notifications/notification-dialog/notification-dialog.component';

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.scss']
})
export class EntityComponent implements OnInit {
  MenuItems: string[];
  authenticationDetails: AuthenticationDetails;
  notificationSnackBarComponent: NotificationSnackBarComponent;
  IsProgressBarVisibile: boolean;
  AllEntities: Entity[] = [];
  SelectedEntity: Entity;
  searchText = '';
  selectEntityID = 0;
  EntityFormGroup: FormGroup;

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
    this.SelectedEntity = new Entity();
    this.EntityFormGroup = this._formBuilder.group({
      EntityName: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Retrive authorizationData
    const retrievedObject = localStorage.getItem('authorizationData');
    if (retrievedObject) {
      this.authenticationDetails = JSON.parse(retrievedObject) as AuthenticationDetails;
      this.MenuItems = this.authenticationDetails.menuItemNames.split(',');
      if (this.MenuItems.indexOf('Entity') < 0) {
        this.notificationSnackBarComponent.openSnackBar('You do not have permission to visit this page', SnackBarStatus.danger);
        this._router.navigate(['/auth/login']);
      }
      this.GetAllEntities();
    } else {
      this._router.navigate(['/auth/login']);
    }
  }

  ResetControl(): void {
    this.SelectedEntity = new Entity();
    this.selectEntityID = 0;
    this.EntityFormGroup.reset();
    Object.keys(this.EntityFormGroup.controls).forEach(key => {
      this.EntityFormGroup.get(key).markAsUntouched();
    });

  }

  AddEntity(): void {
    this.ResetControl();
  }

  GetAllEntities(): void {
    this.IsProgressBarVisibile = true;
    this._masterService.GetAllEntity().subscribe(
      (data) => {
        if (data) {
          this.AllEntities = data as Entity[];
          if (this.AllEntities.length && this.AllEntities.length > 0) {
            this.loadSelectedEntity(this.AllEntities[0]);
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

  loadSelectedEntity(entity: Entity): void {
    this.SelectedEntity = entity;
    this.selectEntityID = entity.ID;
    this.EntityFormGroup.get('EntityName').patchValue(entity.EntityName);
  }

  SaveClicked(): void {
    if (this.EntityFormGroup.valid) {
      if (this.SelectedEntity.ID) {
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
    if (this.EntityFormGroup.valid) {
      if (this.SelectedEntity.ID) {
        const Actiontype = 'Delete';
        this.OpenConfirmationDialog(Actiontype);
      }
    } else {
      this.ShowValidationErrors();
    }
  }

  ShowValidationErrors(): void {
    Object.keys(this.EntityFormGroup.controls).forEach(key => {
      this.EntityFormGroup.get(key).markAsTouched();
      this.EntityFormGroup.get(key).markAsDirty();
    });
  }

  OpenConfirmationDialog(Actiontype: string): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        Actiontype: Actiontype,
        Catagory: 'Entity'
      },
      panelClass: 'confirmation-dialog'
    };
    const dialogRef = this.dialog.open(NotificationDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          if (Actiontype === 'Create') {
            this.CreateEntity();
          } else if (Actiontype === 'Update') {
            this.UpdateEntity();
          } else if (Actiontype === 'Delete') {
            this.DeleteEntity();
          }
        }
      });
  }

  CreateEntity(): void {
    this.SelectedEntity.EntityName = this.EntityFormGroup.get('EntityName').value;
    this.SelectedEntity.CreatedBy = this.authenticationDetails.userID.toString();
    this.IsProgressBarVisibile = true;
    this._masterService.CreateEntity(this.SelectedEntity).subscribe(
      (data) => {
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar('Entity created successfully', SnackBarStatus.success);
        this.GetAllEntities();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

  UpdateEntity(): void {
    this.SelectedEntity.EntityName = this.EntityFormGroup.get('EntityName').value;
    this.SelectedEntity.ModifiedBy = this.authenticationDetails.userID.toString();
    this.IsProgressBarVisibile = true;
    this._masterService.UpdateEntity(this.SelectedEntity).subscribe(
      (data) => {
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar('Entity updated successfully', SnackBarStatus.success);
        this.GetAllEntities();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

  DeleteEntity(): void {
    this.SelectedEntity.EntityName = this.EntityFormGroup.get('EntityName').value;
    this.SelectedEntity.ModifiedBy = this.authenticationDetails.userID.toString();
    this.IsProgressBarVisibile = true;
    this._masterService.DeleteEntity(this.SelectedEntity).subscribe(
      (data) => {
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar('Entity deleted successfully', SnackBarStatus.success);
        this.GetAllEntities();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

}
