{
    "states": {
        "loading": "loading",
        "enterClass": "enterClass",
        "joinClass": "joinClass",
        "photoBooth": "photoBooth",
        "followMe": "followMe",
        "attention": "attention",
        "closeTabs": "closeTabs",
        "dashboard": "dashboard",
        "connectionError": "connectionError",
        "connectionClosed": "connectionClosed"
    },

    "profileEndpoint": "{{ frontend.student.profile_endpoint }}",
    "checkEndpoint":        "{{ frontend.student.check_endpoint }}",
    "invalidateEndpoint":   "{{ frontend.student.invalidate_endpoint }}",
    "presenceEndpointUrl": "{{ frontend.common.rendez_vous_endpoint }}",
    "loggingEndpoint": "{{ frontend.common.logging_endpoint }}",

    "secureCookies":        {{ server.cookie.is_secure }}
}
