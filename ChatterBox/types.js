export default class Types {
    constructor() {
        this.ComponentTypes = Object.freeze({
            EMBED: 1,
            IMAGE: 2,
            VIDEO: 3
        })

        this.ErrorTypes = Object.freeze({
            JWT_EXPIRE: 1,
            NULL_TOKEN: 2,
            USER_ALREADY_EXIST: 3,
            USER_NOT_FOUND: 4,
            PERMISSIONS: 5,
            INVALID_REQUEST: 6,
            INVALID_CREDENTIALS: 7
        })

        this.SuccessTypes = Object.freeze({
            FAILED: 0,
            SUCCESS: 1
        })
    }
}