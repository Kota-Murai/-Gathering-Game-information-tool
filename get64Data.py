import requests,bs4
import re
import time

category = 'N64'
url = 'https://ja.wikipedia.org/wiki/NINTENDO64%E3%81%AE%E3%82%B2%E3%83%BC%E3%83%A0%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB%E4%B8%80%E8%A6%A7'

def getURL(soft_name):
  url = 'https://search.rakuten.co.jp/search/mall/' + soft_name + '+N64/101205/?s=12'
  res = requests.get(url)
  # time.sleep(0.3)
  soup = bs4.BeautifulSoup(res.content, "html.parser")
  img = soup.find('img', class_='_verticallyaligned')
  img_srcURL = None
  try:
    img_srcURL = img['src']
  except:
    img_srcURL = 'NULL'
  return img_srcURL


def main():
  res = requests.get(url)
  soup = bs4.BeautifulSoup(res.text, "html.parser")
  index = soup.select('#mw-content-text')

  filepath = "./NINTENDO64.txt"

  # ファイルに追記する前にファイルを初期化する.
  f = open(filepath, "w", encoding='utf-8')
  f.close()

  # beautifulsoupで取り込んだテキストをファイルへ書き込み.
  f = open(filepath, 'a', encoding='utf-8')
  for i in index:
    f.write(i.getText())
  f.close()

  # ファイルの内容を一行ずつ読み取り.
  f = open(filepath, 'r', encoding='utf-8')
  # 各行を取得する準備.
  lines = f.readlines()
  f.close()
  s_lines = [line.strip() for line in lines]

  # ファイルへ書き込んだ内容を1行ずつ解釈しゲームデータをcsvファイルへ書きこみ.
  csv_filepath = 'NINTENDO64.csv'
  f = open(csv_filepath, 'w', encoding='utf-8')
  f.close()
  f = open(csv_filepath, 'a', encoding='utf-8')
  # 一行ずつ取得していく.
  release_year = 0
  for line in s_lines:
    if ('発売中止ソフト（全92タイトル）[編集]' in line):
      print('End')
      break
    elif (re.match("[0-9]{1,4}年（", line)):
      release_year = re.match("[0-9]{1,4}年", line).group()
    else:
      match_result = re.match("[0-9]{1,2}月[0-9]{1,2}日", line)
      if match_result:
        # 発売日を取得.
        date = release_year + match_result.group()
        # ソフト名を取得.
        soft_name = line[match_result.end()+1:line.find('（')]
        # 販売会社を取得.
        sales_company = line[line.find('（')+1:line.find('）')]
        # 画像URLを取得.
        img_src = getURL(soft_name)
        # 発売日、ソフト名、販売会社、カテゴリ、画像URLをcsvファイルへ書き込み.
        game_info = date + ',' + soft_name + ','+sales_company + ',' + category + ',' + img_src
        f.write(game_info + '\n')
  f.close()

main()