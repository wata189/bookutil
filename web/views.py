from django.shortcuts import render
from .modules.util import renderPage

PAGE_DICT = {
    'top': 'BookUtil'
}

# ルーティング関数
# トップ画面
def top(request):
    page_id = 'top'
    context = {}
    return renderPage(request, page_id, PAGE_DICT[page_id], context)