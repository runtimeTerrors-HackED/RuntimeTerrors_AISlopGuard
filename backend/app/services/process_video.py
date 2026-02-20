import requests
from urllib.parse import parse_qs, urlparse

class ProcessVideo:
    def __init__(self, url):
        self.url = url

    def process_url(self):
        print(self.url)
