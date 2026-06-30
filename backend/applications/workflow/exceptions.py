class TransitionError(Exception):
    code = "transition_error"
    http_status = 400

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class InvalidStatus(TransitionError):
    code = "invalid_status"
    http_status = 409


class IllegalTransition(TransitionError):
    code = "illegal_transition"
    http_status = 409


class CommentRequired(TransitionError):
    code = "comment_required"
    http_status = 400


class TransitionForbidden(TransitionError):
    code = "forbidden"
    http_status = 403
