from django.http import HttpResponse
from django.template import Context, loader

# レンダリング処理
def renderPage(request, page_id:str, page_name:str, context:dict[str,str]):
    template = loader.get_template(page_id + '.html')
    page_context = {"pageId": page_id, "pageName": page_name}
    context.update(page_context)
    return HttpResponse(template.render(context, request))
