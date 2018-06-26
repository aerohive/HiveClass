#!/bin/sh
docker inspect --format '{{ .Name }}:{{ .NetworkSettings.IPAddress }}:{{ range $key, $value := .NetworkSettings.Ports }}{{ $key }}{{ end }}' $(docker ps |grep services |cut -c-12) |sed 's/....$//' |cut -c2-
