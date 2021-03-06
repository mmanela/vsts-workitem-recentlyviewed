## Who Viewed this Work Item? - VSTS Work Item Form Extension ##

An [extension](https://marketplace.visualstudio.com/items?itemName=mmanela.vsts-workitem-recentlyviewed) for the [Team Services](https://www.visualstudio.com/en-us/products/visual-studio-team-services-vs.aspx) work item form that tracks who viewed each work item.


### Overview

This extension adds a group to the work item form (in VSTS and TFS "15") which shows the most recent distinct people who view the work item. 

![Group](img/GroupExample.png)


Clicking on the __View All__ button takes you to a full view showing every person who visited the work item including multiple visits from the same person. 



![ViewAll](img/ViewAllExample.png)

The number of visits kept for each work item is capped at the 500 most recent. 


### How it works?

This extensions works by recording each time a person visits a work item. After the form is opened the extension will
wait and see if the person remains on the work item for at least 10 seconds. If so, it makes sure this person has not visited the same work item less than 10 minutes ago before recording the new visit. 
This window is meant to help catch *new* visits.


### Feedback

For bugs please use the [issue tracker](https://github.com/mmanela/vsts-workitem-recentlyviewed/issues) on the [GitHub repo](https://github.com/mmanela/vsts-workitem-recentlyviewed).

For feedback/questions contact me on Twitter: [@mmanela](https://twitter.com/mmanela).
