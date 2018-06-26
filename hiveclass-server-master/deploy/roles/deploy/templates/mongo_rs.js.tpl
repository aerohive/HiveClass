var cfg = rs.conf();
cfg.members[0].priority = 10;
cfg.members[0].host = '{{ ansible_eth0.ipv4.address }}:{{ server.mongodb.external_port }}';
rs.reconfig(cfg);
rs.addArb('{{ server.mongodb.arbiter.host }}:{{ server.mongodb.arbiter.port }}');
rs.add({ host: '{{ server.mongodb.backup.host }}:{{ server.mongodb.backup.port }}', priority: 0 });

