# # redis_test.py
# import redis
#
# r = redis.Redis(host='192.168.219.198', port=6379, db=0)
#
# # 키 목록 출력
# keys = r.keys('sensor:*')
# print("Redis keys:", keys)
#
# # 데이터 읽기
# for key in keys:
#     value = r.get(key)
#     print(f"{key.decode()} → {value.decode()}")
