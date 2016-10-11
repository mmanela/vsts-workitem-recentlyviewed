import Q = require("q");
import VSS_Service = require("VSS/Service");
import * as Utils_Core from "VSS/Utils/Core";
import {Control} from "VSS/Controls";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import {WorkItemUpdate} from "TFS/WorkItemTracking/Contracts";
import {WorkItemFormNavigationService} from "TFS/WorkItemTracking/Services";
import { WorkItemVisit, Constants} from "../Models";
import {manager} from "../VisitManager"


export interface IRecentlyViewedListOptions {
    maxCount: number;
}

export class RecentlyViewedList extends Control<IRecentlyViewedListOptions> {
    private _visitsContainer: JQuery;
    private _currentWorkItemId: number;
    
    public initialize(): void {
        super.initialize();

        // Initialize elements
        this._visitsContainer = $("<div/>").addClass("rv-container").appendTo(this.getElement());
    }
    
    public initializeOptions(options: IRecentlyViewedListOptions) {
        this._options = options;
    }

    /*
    * Renders views
    *
    */
    public render(workItemId: number, visits: WorkItemVisit[]): void {
                
        this._currentWorkItemId = workItemId;
        this._visitsContainer.empty();

        if (visits && visits.length > 0) {
            
            
            // Pre-process the list to ensure that in the list views
            // we show an optimize version given the count limit
            // This entails trying to show unique values over repeated views 
            
            let map = {};
            let uniqueVisits = visits.reverse().filter((visit) =>{ 
                if(map[visit.user.uniqueName] === undefined) {
                    map[visit.user.uniqueName] = 0;
                    return true;
                } else {
                    map[visit.user.uniqueName] += 1;
                    return false;
                }
                
            });
            
            uniqueVisits = uniqueVisits.slice(0,this._options.maxCount);       
            
            // Render filtered activities
            uniqueVisits.forEach((visit: WorkItemVisit) => {
                this._visitsContainer.append(this._createVisitRow(visit));
            });
        }
    }

    private _createVisitRow(visit: WorkItemVisit): JQuery {
        var $result = $("<div />").addClass("rv-visit");

        // Image/Person
        var identityImageUrl = `${VSS.getWebContext().host.uri}/_api/_common/IdentityImage?id=`;
        identityImageUrl = `${identityImageUrl}&identifier=${visit.user.uniqueName}&identifierType=0`;
        var $visitedImageElement = $("<div/>").addClass("visited-image");
        var $imageElement = $("<img/>").attr("src", identityImageUrl).appendTo($visitedImageElement);
        $result.append($visitedImageElement);
        
        
        var $userNameElement = $("<div class='visited-name' />").append(visit.user.name);
        $userNameElement.attr("title", visit.user.uniqueName);
        $imageElement.attr("title", visit.user.name);
        $result.append($userNameElement);
        


            
        // Visited date
        var dateMoment = moment(visit.date.toLocaleString());
        var dateStringFromNow = dateMoment.fromNow();
        var dateElem = $("<div />").addClass("visited-date").text(`${dateStringFromNow}`);
        dateElem.attr("title", dateMoment.format(Constants.FullDateString));
        dateElem.appendTo($result);

        return $result;
    }

}
