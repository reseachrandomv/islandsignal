import sys
from playwright.sync_api import sync_playwright
B = sys.argv[1]
errs=[]
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width":390,"height":844})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("dialog", lambda d: d.accept("spam test"))
    pg.goto(B); pg.wait_for_selector("article")
    print("feed cards", pg.locator("article").count())
    pg.goto(B+"login/"); pg.fill("input[placeholder='Your name']","Tester"); pg.select_option("select","admin"); pg.click("text=Continue")
    pg.wait_for_selector("text=Hi, Tester")
    pg.goto(B+"report/"); pg.click("text=Lost & found"); pg.select_option("select","sample-b")
    pg.fill("label:has-text('Title') input","Test keys found"); pg.fill("textarea","Found a set of keys near the shop, test.")
    pg.click("text=Post report"); pg.wait_for_url(B); pg.wait_for_selector("text=Test keys found")
    pg.locator("article", has_text="Test keys found").locator("text=Still happening").click()
    pg.wait_for_selector("text=Thanks, confirmed.")
    pg.locator("article", has_text="Test keys found").locator("text=Flag").click()
    pg.wait_for_selector("text=Flagged for moderators.")
    pg.goto(B+"admin/"); pg.wait_for_selector("text=Admin dashboard")
    print("flagged rows", pg.locator(".card:has-text('Test keys found')").count())
    pg.locator(".card", has_text="Test keys found").locator("button:has-text('Remove')").click()
    pg.wait_for_timeout(300); pg.goto(B); pg.wait_for_selector("article")
    print("removed hidden", pg.locator("text=Test keys found").count()==0)
    print("errors", errs)
    b.close()
