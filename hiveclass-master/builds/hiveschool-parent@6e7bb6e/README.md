HiveSchool
===

Initial setup.
-------------

1. `git clone git@github.com:montagestudio/hiveclass.git`
2. `cd hiveclass`
3. `cd login`
4. `npm install`
5. `cd ../student`
6. `npm install`
7. `cd ../teacher`
8. `npm install`
9. `cd ../..`
10. `git clone git@github.com:montagestudio/hiveclass-server.git`
11. `cd hiveclass-server`
12. `cd apps`
13. `npm install`
14. `ln -s ../../hiveclass/login`
15. `ln -s ../../hiveclass/student`
16. `ln -s ../../hiveclass/teacher`
17. `cd ../auth`
18. `npm install`
19. `cd ../rendezvous`
20. `npm install`
21. `cd ../router`
22. `npm install`
23. `cd ..`

Launch services.
-------------
1. Ensure the public address is configured in the following:
  - https://github.com/montagestudio/hiveclass/blob/master/login/core/configuration.js#L3
  - https://github.com/montagestudio/hiveclass/blob/master/student/core/configuration.js#L22
  - https://github.com/montagestudio/hiveclass/blob/master/teacher/core/configuration.js#L25
  - https://github.com/montagestudio/hiveclass/blob/master/teacher/core/configuration.js#L28
2. Ensure the rendezvous service public host and port are configured in the following:
  - https://github.com/montagestudio/hiveclass/blob/master/student/core/configuration.js#L23
  - https://github.com/montagestudio/hiveclass/blob/master/student/core/configuration.js#L24
  - https://github.com/montagestudio/hiveclass/blob/master/teacher/core/configuration.js#L26
  - https://github.com/montagestudio/hiveclass/blob/master/teacher/core/configuration.js#L27
3. Launch every service as follow:
  - `cd apps`
  - `node app.js`
  - `cd auth`
  - `node app.js`
  - `cd rendezvous`
  - `node app.js`
  - `cd router`
  - `node app.js`

Make a new chrome extension version.
-------------

1. Ensure the public address is configured in the following:
  - https://github.com/montagestudio/hiveclass/blob/master/extensions/student/js/configuration.js#L3
  - https://github.com/montagestudio/hiveclass/blob/master/extensions/teacher/js/configuration.js#L3
1. Go to chrome://extensions/
2. Click on my pack extension
3. For each extension (student and teacher), select the extension folder and pack it.

## Analytics
===

**[Instrumentation Summary](https://docs.google.com/spreadsheets/d/1xW-hetMYWxjq_QXOVjxkfxCXF0az4KJk5qavARIEu58/edit?usp=sharing)**

**Naming convention**

**Apps**

App-wide config is set in `applicaition-delegate.js` (currently uses what's in `package.json`)

**Views**

Tracked in `enterDocument`, not just `firstTime`

**Events**

`eventCategory`
- `button`
- `toggle`

`eventAction`
- `click`
- `toggle`
