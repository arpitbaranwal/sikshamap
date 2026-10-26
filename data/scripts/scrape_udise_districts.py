import requests
import json
import time
import os
import urllib3
urllib3.disable_warnings()

token = "Bearer df;lkjz8lke4lk345kljsdfkjdfgkljsf08994a/sdfljsdf879w4ra/sdflksdf"
headers = {
    "Content-Type": "application/json",
    "Authorization": token,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

base_v1 = "https://api.udiseplus.gov.in/open-services/v1.1/"
base_kpi = base_v1 + "kpi/"

# 1. Fetch district list
print("Fetching 52 districts of Madhya Pradesh...")
r = requests.get(base_v1 + "districts/23/9", headers=headers, verify=False, timeout=10)
districts = r.json().get("data", [])
print(f"Found {len(districts)} districts.")

os.makedirs(r"g:\EPICS\data\raw", exist_ok=True)
all_district_data = []

for idx, d in enumerate(districts):
    d_code = d["udiseDistrictCode"]
    d_name = d["udiseDistrictName"]
    print(f"[{idx+1}/{len(districts)}] Scraping {d_name} ({d_code})...")
    
    dist_record = {
        "udiseDistrictCode": d_code,
        "udiseDistrictName": d_name
    }
    
    # 1. Basic Infra
    try:
        p_infra = {"yearId": 9, "regionType": 12, "regionCode": d_code, "valueType": 1}
        r_infra = requests.post(base_kpi + "schools-basic-infra/public", headers=headers, json=p_infra, timeout=12, verify=False)
        infra_items = r_infra.json().get("data", [])
        if infra_items:
            dist_record["infra"] = infra_items[0]
    except Exception as e:
        print(f"  Infra error for {d_name}: {e}")
        
    # 2. PTR
    try:
        p_ptr = {"yearId": 9, "regionType": 12, "regionCode": d_code, "valueType": 1}
        r_ptr = requests.post(base_kpi + "ptr/public", headers=headers, json=p_ptr, timeout=12, verify=False)
        ptr_items = r_ptr.json().get("data", [])
        if ptr_items:
            dist_record["ptr"] = ptr_items[0]
    except Exception as e:
        print(f"  PTR error for {d_name}: {e}")

    # 3. Teachers & Training
    try:
        p_tch = {"yearId": 9, "regionType": 12, "regionCode": d_code, "valueType": 1}
        r_tch = requests.post(base_kpi + "teachers/public", headers=headers, json=p_tch, timeout=12, verify=False)
        tch_items = r_tch.json().get("data", [])
        if tch_items:
            dist_record["teachers"] = tch_items[0]
            
        r_trng = requests.post(base_kpi + "teachers-training/public", headers=headers, json=p_tch, timeout=12, verify=False)
        trng_items = r_trng.json().get("data", [])
        if trng_items:
            dist_record["training"] = trng_items[0]
    except Exception as e:
        print(f"  Teachers error for {d_name}: {e}")

    # 4. Enrollment & Dropout
    try:
        p_enr = {"yearId": 9, "regionType": 12, "regionCode": d_code, "valueType": 1}
        r_enr = requests.post(base_kpi + "students-enrollment/public", headers=headers, json=p_enr, timeout=12, verify=False)
        enr_items = r_enr.json().get("data", [])
        if enr_items:
            dist_record["enrollment"] = enr_items[0]
    except Exception as e:
        print(f"  Enrollment error for {d_name}: {e}")
        
    all_district_data.append(dist_record)
    time.sleep(0.15) # Polite request interval

out_file = r"g:\EPICS\data\raw\udise_52_districts.json"
with open(out_file, "w", encoding="utf-8") as f:
    json.dump(all_district_data, f, indent=2)

print(f"Successfully scraped all {len(all_district_data)} districts to {out_file}")

