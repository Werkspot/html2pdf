# html2pdf
HTTP Service to convert HTML to PDF.

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

# TODO
- enable SSL
- have monitoring

