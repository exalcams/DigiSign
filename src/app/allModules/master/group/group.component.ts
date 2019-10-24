import { Component, OnInit } from '@angular/core';
import { MasterService } from 'app/services/master.service';
import { Group } from 'app/models/master';

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {
  AllGroups: Group[] = [];
  searchText = '';
  selectID = 0;
  constructor(
    private _masterService: MasterService
  ) {

  }

  ngOnInit(): void {

  }

}
