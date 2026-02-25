"""
各业务实体的 CRUD 实例
"""
from app.crud.base import CRUDBase
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order
from app.models.after_sale import AfterSale
from app.models.notification import Notification
from app.models.dictionary import Dictionary
from app.models.audit_log import AuditLog
from app.models.opportunity import Opportunity
from app.models.sales_target import SalesTarget
from app.models.task import Task

from app.schemas.user import UserCreate, UserUpdate
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.order import OrderCreate, OrderUpdate
from app.schemas.after_sale import AfterSaleCreate, AfterSaleUpdate
from app.schemas.dictionary import DictionaryCreate, DictionaryUpdate
from app.schemas.opportunity import OpportunityCreate, OpportunityUpdate
from app.schemas.task import TaskCreate, TaskUpdate

crud_user = CRUDBase[User, UserCreate, UserUpdate](User)
crud_customer = CRUDBase[Customer, CustomerCreate, CustomerUpdate](Customer)
crud_product = CRUDBase[Product, ProductCreate, ProductUpdate](Product)
crud_order = CRUDBase[Order, OrderCreate, OrderUpdate](Order)
crud_after_sale = CRUDBase[AfterSale, AfterSaleCreate, AfterSaleUpdate](AfterSale)
crud_notification = CRUDBase[Notification, None, None](Notification)
crud_dictionary = CRUDBase[Dictionary, DictionaryCreate, DictionaryUpdate](Dictionary)
crud_audit_log = CRUDBase[AuditLog, None, None](AuditLog)
crud_opportunity = CRUDBase[Opportunity, OpportunityCreate, OpportunityUpdate](Opportunity)
crud_sales_target = CRUDBase[SalesTarget, None, None](SalesTarget)
crud_task = CRUDBase[Task, TaskCreate, TaskUpdate](Task)
