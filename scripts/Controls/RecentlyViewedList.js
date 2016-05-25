var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "VSS/Controls", "scripts/Models"], function (require, exports, Controls_1, Models_1) {
    "use strict";
    var RecentlyViewedList = (function (_super) {
        __extends(RecentlyViewedList, _super);
        function RecentlyViewedList() {
            _super.apply(this, arguments);
        }
        RecentlyViewedList.prototype.initialize = function () {
            _super.prototype.initialize.call(this);
            this._visitsContainer = $("<div/>").addClass("rv-container").appendTo(this.getElement());
        };
        RecentlyViewedList.prototype.initializeOptions = function (options) {
            this._options = options;
        };
        RecentlyViewedList.prototype.render = function (workItemId, visits) {
            var _this = this;
            if (workItemId === this._currentWorkItemId) {
                return;
            }
            this._currentWorkItemId = workItemId;
            this._visitsContainer.empty();
            if (visits && visits.length > 0) {
                var map_1 = {};
                var uniqueVisits = visits.reverse().filter(function (visit) {
                    if (map_1[visit.user.uniqueName] === undefined) {
                        map_1[visit.user.uniqueName] = 0;
                        return true;
                    }
                    else {
                        map_1[visit.user.uniqueName] += 1;
                        return false;
                    }
                });
                uniqueVisits = uniqueVisits.slice(0, this._options.maxCount);
                uniqueVisits.forEach(function (visit) {
                    _this._visitsContainer.append(_this._createVisitRow(visit));
                });
            }
        };
        RecentlyViewedList.prototype._createVisitRow = function (visit) {
            var $result = $("<div />").addClass("rv-visit");
            var identityImageUrl = VSS.getWebContext().host.uri + "/_api/_common/IdentityImage?id=";
            identityImageUrl = identityImageUrl + "&identifier=" + visit.user.uniqueName + "&identifierType=0";
            var $visitedImageElement = $("<div/>").addClass("visited-image");
            var $imageElement = $("<img/>").attr("src", identityImageUrl).appendTo($visitedImageElement);
            $result.append($visitedImageElement);
            var $userNameElement = $("<div class='visited-name' />").append(visit.user.name);
            $userNameElement.attr("title", visit.user.uniqueName);
            $imageElement.attr("title", visit.user.name);
            $result.append($userNameElement);
            var dateMoment = moment(visit.date.toLocaleString());
            var dateStringFromNow = dateMoment.fromNow();
            var dateElem = $("<div />").addClass("visited-date").text("" + dateStringFromNow);
            dateElem.attr("title", dateMoment.format(Models_1.Constants.FullDateString));
            dateElem.appendTo($result);
            return $result;
        };
        return RecentlyViewedList;
    }(Controls_1.Control));
    exports.RecentlyViewedList = RecentlyViewedList;
});
