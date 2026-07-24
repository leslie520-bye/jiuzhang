import json, urllib.request

url = "https://www.mathjiuzhang.cn/api/diagnose"
data = json.dumps({"questions":[{"question":"x^2-5x+6=0","correctAnswer":"x=2","studentAnswer":"公式代入符号错了","isCorrect":false}],"enableLLM":false}).encode()
req = urllib.request.Request(url, data=data, headers={"Content-Type":"application/json"})
try:
    resp = urllib.request.urlopen(req, timeout=15)
    r = json.loads(resp.read())
    print(f"SUCCESS!" if r.get("success") else f"FAIL: {r.get('error')}")
    if r.get("success"):
        s = r.get("summary", {})
        print(f"  Total:{s.get('totalQuestions')} Wrong:{s.get('wrongCount')} Rules:{s.get('ruleMatchCount')}")
except Exception as e:
    print(f"ERROR: {e}")
