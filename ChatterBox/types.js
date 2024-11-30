export default class Types {
    constructor() {
        this.ComponentTypes = Object.freeze({
            EMBED: 1,
            IMAGE: 2,
            VIDEO: 3,
            GIF: 4
        })

        this.ErrorTypes = Object.freeze({
            JWT_EXPIRE: 1,
            NULL_TOKEN: 2,
            UNAME_NOT_AVAILABLE: 3,
            NOT_FOUND: 4,
            PERMISSIONS: 5,
            INVALID_REQUEST: 6,
            INVALID_CREDENTIALS: 7,
            NULL_CONTENT: 8,
            VERIFICATION_FAILED: 9,
            UNKNOWN_ERROR: 10,
            CHANNEL_LIMIT: 11
        })

        this.SuccessTypes = Object.freeze({
            FAILED: 0,
            SUCCESS: 1
        })
    }
}