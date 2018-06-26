{% for service in services.stdout_lines %}
/*
backend default {
    .host = "{{ service.split(':')[1] }}";
    .port = "{{ service.split(':')[2] }}";
}
*/
{% endfor %}

backend default {
    .host = "127.0.0.1";
    .port = "8080";
}
