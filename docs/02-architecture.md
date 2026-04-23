# Architecture

```text
Frontend -> FastAPI -> MySQL
```

The frontend collects auth details and body measurements. FastAPI validates requests, creates JWT sessions, saves data, and reads brand sizing data from MySQL.
