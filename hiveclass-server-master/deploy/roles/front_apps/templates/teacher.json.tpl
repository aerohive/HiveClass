{
    "states":{
        "loading":           "loading",
        "init":              "init",
        "screens":           "screens",
        "dashboard":         "dashboard",
        "resources":         "resources",
        "feedback":          "feedback",
        "reporting":         "reporting",
        "connectionClosed":  "connectionClosed"
    },

    "dashboardMenus":[
        "students",
        "resources"
    ],

    "profileEndpoint":      "{{ frontend.teacher.profile_endpoint}}",
    "checkEndpoint":        "{{ frontend.teacher.check_endpoint }}",
    "invalidateEndpoint":   "{{ frontend.teacher.invalidate_endpoint }}",
    "storageEndpoint":      "{{ frontend.teacher.storage_endpoint}}",
    "presenceEndpointUrl":  "{{ frontend.common.rendez_vous_endpoint }}",
    "studentUrl":           "{{ frontend.student.app_url }}",

    "secureCookies":        {{ server.cookie.is_secure }}
}
