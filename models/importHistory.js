class ImportHistory {
    constructor(userName, _importCount, _addedUsersList, _removedUsersList) {
        this.createdDate = new Date();
        this.ownerName = userName;
        this.importCount = _importCount;
        this.addedUsers = _addedUsersList;
        this.removedUsers=_removedUsersList;
    }
}
module.exports = ImportHistory;