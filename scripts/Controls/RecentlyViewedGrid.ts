import Q = require("q");
import VSS_Service = require("VSS/Service");
import * as Utils_Core from "VSS/Utils/Core";
import {Control} from "VSS/Controls";
import * as Grids from "VSS/Controls/Grids";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import {WorkItemUpdate} from "TFS/WorkItemTracking/Contracts";
import {WorkItemFormNavigationService} from "TFS/WorkItemTracking/Services";
import { WorkItemVisit, Constants} from "scripts/Models";
import {manager} from "scripts/VisitManager"


interface IVisitGridRow {
    Avatar: string;
    Name: string;
    Email: string;
    Date: string;
}

export class RecentlyViewedGrid extends Control<any> {
    private _visitsContainer: JQuery;
    private _currentWorkItemId: number;
    private _gridColumns: Grids.IGridColumn[];
    
    public initialize(): void {
        super.initialize();

        // Initialize elements
        this._visitsContainer = $("<div/>").addClass("rv-container").appendTo(this.getElement());
    }

    /*
    * Renders views
    *
    */
    public render(workItemId: number, visits: WorkItemVisit[]): void {
        
        // If we already rendered this work item no-op
        if(workItemId === this._currentWorkItemId) {
            return;
        }
        
        this._currentWorkItemId = workItemId;
        this._visitsContainer.empty();

        if (visits && visits.length > 0) {
            
          visits = visits.reverse();
          
          let gridSource:IVisitGridRow[] = visits.map((visit) => { 
              return {
                    Avatar: this._getImageUrl(visit.user),
                    Name: visit.user.name,
                    Email: visit.user.email || visit.user.uniqueName,
                    Date: visit.date
                };
          });
          
          let options:Grids.IGridOptions = {
            source: gridSource,
            columns: this._getGridColumns(gridSource),
            height: "100%",
            useBowtieStyle: true
          };
          
          Grids.Grid.createIn<Grids.IGridOptions>(Grids.Grid, this._visitsContainer, options);
          
        }
    }
    
    
    private _getImageUrl(user:UserContext){
        var identityImageUrl = `${VSS.getWebContext().host.uri}/_api/_common/IdentityImage?id=`;
        identityImageUrl = `${identityImageUrl}&identifier=${user.uniqueName}&identifierType=0`;
        return identityImageUrl;
    }
    
    
    
    private _getGridColumns(visitGridRows:IVisitGridRow[]): Grids.IGridColumn[] {
        if (!this._gridColumns) {
            this._gridColumns = <Grids.IGridColumn[]>[
                {
                    index: "Avatar",
                    width: 26,
                    canSortBy: false,
                    getCellContents: function (rowInfo: any, dataIndex: number, expandedState: number, level: number, column: any, indentIndex: number, columnOrder: number) {
                        // "this" is the grid
                        var grid: Grids.Grid = this;
                        var item: IVisitGridRow = grid._dataSource[dataIndex];
                        if (item) {
                            var $visitedImageElement = $("<div/>").addClass("visited-image-cell grid-cell");
                            var $imageElement = $("<img/>").attr("src", item.Avatar).appendTo($visitedImageElement);
                            return $visitedImageElement;
                        }
                    }
                },
                {
                    index: "Name",
                    text: "Name",
                    width: 200,
                    canSortBy: true
                },
                {
                    index: "Email",
                    text: "Email",
                    width: 200,
                    canSortBy: true
                },
                {
                    index: "Date",
                    text: "Date",
                    width: 200,
                    canSortBy: true,
                    getColumnValue: (dataIndex, columnIndex, columnOrder) => {
                        var date = visitGridRows[dataIndex].Date;
                        return moment(date).format(Constants.FullDateString);
                    }
                }
            ]
        };
        
        return this._gridColumns;
    }

}
