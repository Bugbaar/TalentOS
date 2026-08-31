from pwdlib import PasswordHash

pwd=PasswordHash.recommended()



def hash_password(password:str):
    return pwd.hash(password)

def verify_password(plain_password:str , hashed_password:str):
    try:
        pwd.verify(plain_password , hashed_password)
        return True
    except Exception:
        return False