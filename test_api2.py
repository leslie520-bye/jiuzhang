import json, urllib.request
url = "https://www.mathjiuzhang.cn/api/diagnose"
data = json.dumps({"questions":[{"question":"test x=1","correctAnswer":"x=1","studentAnswer":"x=2 sign wrong","isCorrect":False}],"enableLLM":False}).encode()
req = urllib.request.Request(url, data=data, headers={"Content-Type":"application/json"})
try:
    resp = urllib.request.urlopen(req, timeout=15)
    r = json.loads(resp.read())
    if r.get("success"):
        s = r.get("summary", {})
        print("SUCCESS!")
        print("  Total: " + str(s.get("totalQuestions")) + " Wrong: " + str(s.get("wrongCount")) + " Rules: " + str(s.get("ruleMatchCount")) + " LLM: " + str(s.get("llmFallbackCount")) + " Time: " + str(s.get("processingTime")) + "ms")
    else:
        print("FAIL: " + json.dumps(r))
except urllib.error.HTTPError as e:
    body = e.read().decode()
    if "diagnosticEngine" in body or "Error" in body:
        print("Still waiting for redeploy... " + body[:150])
    else:
        print("HTTP " + str(e.code) + ": " + body[:200])
