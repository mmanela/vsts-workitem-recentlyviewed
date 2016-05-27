export class WorkItemVisit {
    public workItemId: number;
    public revision: number;
    public date: string;
    public user: UserContext;
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
     * The work item visits s
     */
    public visits: WorkItemVisit[];
    
    public __etag: number;
    
}


export class Constants {
    public static StorageKey: string = "WorkItemVisits";
    public static UtcRegex = /\d+-\d+-\d+T\d+:\d+:\d+\.\d+Z/;
    
    public static ExtensionPublisher = "mmanela";
    public static ExtensionName = "vsts-workitem-recentlyviewed";
    
    public static MaxVisitsToStore = 1000;
    
    public static GroupViewVisitCount = 4;
    
    public static FullDateString = "LLLL";
    
    public static DocumentCollectionName = "WorkItemVisitCollection";
    
    public static RecordRetryAttempts = 3;
}


export function getStorageKey(workItemId: number){
    return `TEMP1-${Constants.StorageKey}-${workItemId}`;
}