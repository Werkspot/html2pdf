# html2pdf
HTTP Service to convert HTML to PDF.

It was designed to run as a microservice. So make sure that you have a security
layer to encrypt the traffic.

# Build
```
docker build -t werkspot/html2pdf .
```

# Run
```
docker run -it --rm -p 8000:8000 werkspot/html2pdf
```

# How to use it
```
curl http://localhost:8000 --data @file.html > file.pdf
```
More examples on [/examples](/examples).
