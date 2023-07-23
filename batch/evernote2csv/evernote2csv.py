print("start evernote2csv")

from lxml import etree
import os
import csv
import shutil



BASE_PATH = "./batch/evernote2csv/"
EVERNOTES_PATH = BASE_PATH + "evernotes"
OLD_EVERNOTES_PATH = BASE_PATH + "_old_evernotes"
CSV_PATH = BASE_PATH + "bookinfo.csv"

#http://www.hanxiaogang.com/writing/parsing-evernote-export-file-enex-using-python/
p = etree.XMLParser(remove_blank_text=True, resolve_entities=False)

def parse_note(note):
    note_dict = {
        "title": "",
        "tags": "",
        "source_url": ""
    }
    tags = []
    ignore_tags = {'content', 'content-raw', 'resource'}
    for elem in note:
        if elem.tag in ignore_tags:
            continue
        elif elem.tag == 'tag':
            tags.append(elem.text)
        elif elem.tag == "note-attributes":
            for note_attribute in elem:
                if note_attribute.tag == "source-url":
                    note_dict["source_url"] = note_attribute.text
        else:
            note_dict[elem.tag] = elem.text
    
    note_dict["tags"] = "/".join(tags)

    return note_dict

def parseNoteXML(xmlFile):
    # Without huge_tree set to True, parser may complain about huge text node
    # Try to recover, because there may be "&nbsp;", which will cause
    # "XMLSyntaxError: Entity 'nbsp' not defined"
    context = etree.iterparse(xmlFile, encoding='utf-8', strip_cdata=False, huge_tree=True, recover=True)
    notes = []
    for action, elem in context:
        if elem.tag == "note":
            notes.append(parse_note(elem))
    
    yield notes

if __name__ == '__main__':

    files = os.listdir(EVERNOTES_PATH)

    write_rows = []
    for file in files:
        notes = parseNoteXML(EVERNOTES_PATH + "/" + file)
        for note in notes:
            for n in note:
                write_rows.append([n["title"], n["tags"], n["source_url"]])

    #csv書き込み
    with open(CSV_PATH, "a", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(write_rows)

    # evernoteフォルダからoldフォルダに移動
    for file in files:
        shutil.move(EVERNOTES_PATH + "/" + file, OLD_EVERNOTES_PATH)





# 手順
# 1.evernoteで100ファイル選択してエクスポート
# 2.選択したファイルを「エクスポート済」に移動
# 3.このファイルを実行





print("end evernote2csv")