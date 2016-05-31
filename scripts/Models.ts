export class Visitor {
    
    constructor(user: UserContext){
        this.name = user.name;
        this.uniqueName = user.uniqueName;
        
        if(user.uniqueName != user.email) {
            this.email = user.email;
        }
    }
    
    public email: string;
    public uniqueName: string;
    public name: string;
}

export class WorkItemVisit {
    public workItemId: number;
    public date: string;
    public user: Visitor;
}

export class WorkItemVisitsDocument {
    
    constructor(public workItemId: number) {
        this.visits = [];
        this.__etag = 0;
        
        this.id = getStorageKey(workItemId);
    }
    
    /**
     * The documentId
     */
    public id: string;
    
    /**
     * The work item visits
     */
    public visits: WorkItemVisit[];
    
    public __etag: number;
    
}


export class Constants {
    public static StorageKey: string = "WorkItemVisits";
    public static UtcRegex = /\d+-\d+-\d+T\d+:\d+:\d+\.\d+Z/;
    
    public static ExtensionPublisher = "mmanela";
    public static ExtensionName = "vsts-workitem-recentlyviewed";
    
    public static GroupViewVisitCount = 4;
    
    public static FullDateString = "LLLL";
    
    public static DocumentCollectionName = "WorkItemVisitCollection";
    
    /**
     * The max number of visits we store. One reached we will drop the oldest one when new visits come
     */
    public static MaxVisitsToStore = 500;
    
    /**
     * How many attempts to save the visit. This is needed in the case of concurrency.
     */
    public static RecordRetryAttempts = 3;
    
    
    /**
     * The minimum time between visits to a work item for us to log it as a new visit
     */
    public static MinTimeBetweenVisitsInSeconds =  60 * 10;
    
    /**
     * The minimum amount of time a person must be on a work item before we log the visit
     */
    public static MinTimeOnWorkItemInSeconds = 10;
}


export function getStorageKey(workItemId: number){
    return `${Constants.StorageKey}-${workItemId}`;
}